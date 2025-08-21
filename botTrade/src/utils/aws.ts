import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { DecryptCommand, KMSClient } from "@aws-sdk/client-kms";
import crypto from "crypto";

const REGION = process.env.AWS_REGION || "ap-southeast-1";
const SECRET_ID = process.env.EDK_SECRET_ID || "moneymachine-edk"; // tên secret chứa EDK
const ENC_CTX = { scope: "app", table: "users", column: "apiCreds" }; // nếu bạn đã ràng buộc

const sm = new SecretsManagerClient({ region: REGION });
const kms = new KMSClient({ region: REGION });

let cachedDEK: Buffer | null = null;

/** Lấy DEK (plaintext) từ EDK và cache trong RAM */
export async function loadDEK() {
    if (cachedDEK) return cachedDEK;
    const sec = await sm.send(new GetSecretValueCommand({ SecretId: SECRET_ID }));
    if (!sec.SecretString) {
        throw new Error("SecretString is undefined");
    }
    const { edk_b64 } = JSON.parse(sec.SecretString);
    const edk = Buffer.from(edk_b64, "base64");
    const { Plaintext } = await kms.send(
        new DecryptCommand({
            CiphertextBlob: edk,
            EncryptionContext: ENC_CTX, // truyền đúng nếu đã dùng khi tạo EDK
        })
    );
    if (!Plaintext) {
        throw new Error("Plaintext is undefined");
    }
    cachedDEK = Buffer.from(Plaintext as Uint8Array);
    return cachedDEK;
}

/** Mã hoá chuỗi bằng AES-256-GCM. Trả về base64 cho ct/iv/tag */
export async function encryptString(plainText: string, userId: number) {
    // Hàm encrypt xem trong backend. Ở bottrade chỉ cần decrypt
}

/** Giải mã lại về chuỗi */
export async function decryptString({ ct, iv, tag, userId }: { ct: Uint8Array; iv: Uint8Array; tag: Uint8Array; userId: string }) {
    const key = await loadDEK();

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    const aad = Buffer.from(userId);
    decipher.setAAD(aad);
    decipher.setAuthTag(tag);

    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString("utf8");
}
