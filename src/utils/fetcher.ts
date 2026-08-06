import { apiHeaders } from "../config/apiHeaders";
import { handleUnauthorizedResponse } from "../services/api/handleUnauthorizedResponse";
import { useAuthStore } from "../store/useAuthStore";
import { getCachedGeoLocationString } from "../services/location/geoLocation";
import {
	decryptResponse,
	encryptPayload,
	looksLikeEncryptedResponse,
} from "./crypto";
import { getOrCreateDeviceId } from "./deviceId-helper";
import { getEnableEncryption } from "@/src/config/resolvedAppConfig";

type FetcherConfig = {
	baseUrl: string;
	getToken?: () => string | null | Promise<string | null>;
	headers?: Record<string, string>;
};

const extractErrorMessage = (data: any, fallback: string) => {
	// If API returns plain text
	if (typeof data === "string" && data.trim()) return data;

	// If not object
	if (!data || typeof data !== "object") return fallback;

	// Common patterns
	return (
		data.message ||
		data.error ||
		data.details?.message ||          // ✅ your case: { details: { message: "..." } }
		data.details?.error ||
		data.details?.message?.message || // if someone nested again accidentally
		(Array.isArray(data.errors) ? data.errors[0]?.message || data.errors[0] : null) ||
		(Array.isArray(data.details) ? data.details[0]?.message || data.details[0] : null) ||
		fallback
	);
};

export const createFetcher = ({ baseUrl, getToken, headers }: FetcherConfig) => {
	const request = async <T>(
		path: string,
		options: {
			method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
			body?: any;
			headers?: Record<string, string>;
			skipAuth?: boolean;
		} = {
			skipAuth: false,
		}
	): Promise<T> => {
		const method = options.method ?? "GET";

		const [deviceId, geoLocationStr] = await Promise.all([
			getOrCreateDeviceId(),
			getCachedGeoLocationString(),
		]);
		const headers: Record<string, string> = {
			'X-Device-Id': deviceId,
			'X-Geo-Location': geoLocationStr,
			...apiHeaders.getCommon(),
			...(options.headers ?? {}),
		};
		const token = useAuthStore.getState().accessToken;
		if (token) {
			headers.Authorization = `${token}`;
		}
		const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
		if (isFormData) {
			delete headers['Content-Type'];
			delete headers['content-type'];
		}
		const shouldEncryptBody =
			getEnableEncryption() &&
			options.body !== undefined &&
			!isFormData;
		if (shouldEncryptBody) {
			headers['X-Encrypted'] = 'true';
		}
		try {
			let body: BodyInit | undefined;
			if (options.body === undefined) {
				body = undefined;
			} else if (isFormData) {
				body = options.body as FormData;
			} else if (shouldEncryptBody) {
				const encrypted = await encryptPayload(options.body);
				body = JSON.stringify({ data: encrypted });
			} else {
				body = JSON.stringify(options.body);
			}

			const res = await fetch(`${baseUrl}${path}`, {
				cache: 'no-cache',
				method,
				headers,
				body,
			});

			// Read as text first, then try JSON parse
			const rawText = await res.text();
			let data: unknown = rawText
				? (() => {
						try {
							return JSON.parse(rawText);
						} catch {
							return rawText;
						}
					})()
				: null;

			if (!res.ok) {
				// Decrypt error response so the real backend message is visible
				if (
					data !== null &&
					typeof data === 'object' &&
					looksLikeEncryptedResponse(data)
				) {
					try {
						data = await decryptResponse<unknown>(data);
					} catch {
						// Decryption failed; proceed with raw data for best-effort message extraction
					}
				}

				if (res.status === 401) {
					await handleUnauthorizedResponse(method, path, options.skipAuth ?? false);
				}

				const msg = extractErrorMessage(data, res.statusText || "Something went wrong");
				throw Object.assign(new Error(msg), { status: res.status, data });
			}

			// Decrypt when body looks like encrypted payload (so e.g. app-config is decrypted even before config is loaded)
			if (
				data !== null &&
				typeof data === 'object' &&
				looksLikeEncryptedResponse(data)
			) {
				data = await decryptResponse<unknown>(data);
			}

			return data as T;
		} catch (err: any) {
			// fetch() network error / thrown error above
			throw Object.assign(new Error(err?.message || "Network error"), {
				status: err?.status,
				data: err?.data,
			});
		} finally {
			// stop loader if you want
		}
	};

	return { request };
};