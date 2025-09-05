import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { DecryptCommand, KMSClient } from "@aws-sdk/client-kms";
import crypto from "crypto";

const REGION = process.env.AWS_REGION;
const SECRET_ID = process.env.EDK_SECRET_ID; // tên secret chứa EDK
const ENC_CTX = { scope: "app", table: "users", column: "apiCreds" };

const sm = new SecretsManagerClient({ region: REGION });
const kms = new KMSClient({ region: REGION });

let cachedDEK: Buffer | null = null;

/** Get DEK (plaintext) from EDK and cache in RAM */
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
            EncryptionContext: ENC_CTX,
        })
    );
    if (!Plaintext) {
        throw new Error("Plaintext is undefined");
    }
    cachedDEK = Buffer.from(Plaintext as Uint8Array);
    return cachedDEK;
}

/** Encrypt string by AES-256-GCM. Return base64 give us ct/iv/tag */
export async function encryptString(plainText: string, userId: number) {
    // Encrypt function is only used in backend, not in botTrade
}

/** Decrypt to string */
export async function decryptString({ ct, iv, tag, userId }: { ct: Uint8Array; iv: Uint8Array; tag: Uint8Array; userId: string }) {
    const key = await loadDEK();

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    const aad = Buffer.from(userId);
    decipher.setAAD(aad);
    decipher.setAuthTag(tag);

    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString("utf8");
}
