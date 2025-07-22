import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import JSONbig from 'json-bigint';

const config = {
	headers: {
		'x-mbx-apikey': process.env.BINANCE_APIKEY || '',
	},
};

class AxiosService {
	instance: AxiosInstance;
	constructor() {
		this.instance = axios.create({
			transformResponse: [(data) => JSONbig.parse(data)],
		});
		this.instance.interceptors.response.use(this.handleSuccess, this.handleError);
	}

	handleSuccess = (res: AxiosResponse) => {
		return res;
	};

	handleError = (err: AxiosError) => {
		return err;
	};

	get(url: string, configHeader: boolean = false) {
		if (configHeader) return this.instance.get(url, config);
		return this.instance.get(url);
	}

	delete(url: string) {
		return this.instance.delete(url, config);
	}

	post(url: string, data?: any, configHeader: boolean = false) {
		if (configHeader) return this.instance.post(url, data, config);
		return this.instance.post(url, data);
	}

	put(url: string, configHeader: boolean = false) {
		if (configHeader) return this.instance.put(url, null, config);
		return this.instance.put(url);
	}
}

export default new AxiosService();
