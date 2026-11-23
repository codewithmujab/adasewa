export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
	errors?: Record<string, string[]>;
}

export interface PaginationMeta {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface PaginatedData<T> {
	items: T[];
	meta: PaginationMeta;
}
