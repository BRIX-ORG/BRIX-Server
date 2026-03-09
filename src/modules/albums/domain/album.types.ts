export interface AlbumItem {
    image: AlbumImage;
    title: string;
    description: string;
}

export interface AlbumImage {
    url: string;
    publicId: string;
    width?: number;
    height?: number;
}

export interface AlbumEntity {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    background?: string[] | null;
    titleColor?: string | null;
    descriptionColor?: string | null;
    items: AlbumItem[];
    createdAt: Date;
    updatedAt: Date;
}
