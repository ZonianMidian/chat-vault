const ULID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export const UUID =
	/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/g;

function encodeULIDPart(part: bigint, size: number): string {
	let result = '';

	for (let i = 0; i < size; i++) {
		result = ULID_ALPHABET[Number(part % 32n)] + result;
		part /= 32n;
	}

	return result;
}

function decodeULIDPart(part: string, size: number): bigint {
	let result = 0n;

	for (let i = 0; i < size; i++) {
		result = result * 32n + BigInt(ULID_ALPHABET.indexOf(part[i]));
	}

	return result;
}

export function isObjectId(value: string): boolean {
	return /^[0-9a-fA-F]{24}$/.test(value);
}

export function objectIdToUlid(objectId: string): string {
	const id = BigInt(`0x${objectId}`);

	const timestamp = (id >> 64n) * 1000n;
	const random = id & 0xffffffffffffffffn;

	return encodeULIDPart(timestamp, 10) + encodeULIDPart(random, 16);
}

export function ULIDToObjectId(ulid: string): string {
	const timestampPart = (decodeULIDPart(ulid, 10) / 1000n).toString(16).padStart(8, '0');
	const randomPart = decodeULIDPart(ulid.slice(10), 16).toString(16).padStart(16, '0');

	return timestampPart + randomPart;
}

export function ulidDate(ulid: string): string | null {
	const id = ulid.toUpperCase();
	if (!/^[0-9A-HJKMNP-TV-Z]{26}$/.test(id)) return null;

	return new Date(Number(decodeULIDPart(id, 10))).toISOString();
}

export function objectIdDate(objectId: string): string | null {
	if (!isObjectId(objectId)) return null;

	return new Date(parseInt(objectId.slice(0, 8), 16) * 1000).toISOString();
}

export function generateString(length: number): string {
	return Math.random().toString(36).substring(2).slice(0, length);
}
