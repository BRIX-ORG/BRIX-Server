import { Injectable, BadRequestException } from '@nestjs/common';
import { MinioService } from '@/minio/minio.service';
import { SocketGateway } from '@/socket/socket.gateway';
import { ConversationRepository } from '@messages/infrastructure';
import { MessageRepository } from '@messages/infrastructure';
import { MessageResponseDto } from '@messages/dto';
import { MessageImageData, MessageVoiceData, MessageFileData } from '@messages/domain';
import { randomUUID } from 'crypto';

@Injectable()
export class SendMessageService {
    constructor(
        private readonly conversationRepo: ConversationRepository,
        private readonly messageRepo: MessageRepository,
        private readonly minioService: MinioService,
        private readonly socketGateway: SocketGateway,
    ) {}

    async execute(
        senderId: string,
        receiverId: string,
        options: {
            content?: string;
            brickId?: string;
            imageFiles?: Express.Multer.File[];
            voiceFile?: Express.Multer.File;
            file?: Express.Multer.File;
        },
    ): Promise<MessageResponseDto> {
        // Validate: at least one content type must be provided
        const hasContent = !!options.content;
        const hasImages = options.imageFiles && options.imageFiles.length > 0;
        const hasVoice = !!options.voiceFile;
        const hasFile = !!options.file;
        const hasBrick = !!options.brickId;

        if (!hasContent && !hasImages && !hasVoice && !hasFile && !hasBrick) {
            throw new BadRequestException('Message must have at least one content type');
        }

        if (hasImages && options.imageFiles!.length > 3) {
            throw new BadRequestException('Maximum 3 images allowed per message');
        }

        // Find or create conversation
        const conversation = await this.conversationRepo.findOrCreate(senderId, receiverId);

        // Upload images to MinIO
        let images: MessageImageData[] | undefined;
        if (hasImages) {
            images = await Promise.all(
                options.imageFiles!.map(async (img) => {
                    const objectName = `messages/${conversation.id}/images/${randomUUID()}-${img.originalname}`;
                    const result = await this.minioService.uploadFile(
                        objectName,
                        img.buffer,
                        img.mimetype,
                    );
                    return {
                        url: result.url,
                        objectName: result.objectName,
                        etag: result.etag,
                    } as MessageImageData;
                }),
            );
        }

        // Upload voice to MinIO
        let voice: MessageVoiceData | undefined;
        if (hasVoice) {
            const voiceFile = options.voiceFile!;
            const objectName = `messages/${conversation.id}/voice/${randomUUID()}-${voiceFile.originalname}`;
            const result = await this.minioService.uploadFile(
                objectName,
                voiceFile.buffer,
                voiceFile.mimetype,
            );
            voice = {
                url: result.url,
                objectName: result.objectName,
                etag: result.etag,
                duration: 0, // Client should send duration metadata
                mimeType: voiceFile.mimetype,
            };
        }

        // Upload file to MinIO
        let file: MessageFileData | undefined;
        if (hasFile) {
            const f = options.file!;
            const objectName = `messages/${conversation.id}/files/${randomUUID()}-${f.originalname}`;
            const result = await this.minioService.uploadFile(objectName, f.buffer, f.mimetype);
            file = {
                url: result.url,
                objectName: result.objectName,
                etag: result.etag,
                fileName: f.originalname,
                fileSize: f.size,
                mimeType: f.mimetype,
            };
        }

        // Create message
        const message = await this.messageRepo.create({
            conversationId: conversation.id,
            senderId,
            content: options.content,
            images: images,
            voice: voice,
            file: file,
            brickId: options.brickId,
        });

        // Update conversation timestamp
        await this.conversationRepo.touch(conversation.id);

        // Emit real-time event
        const responseDto = MessageResponseDto.fromEntity(message);
        this.socketGateway.emitNewMessage(conversation.id, responseDto);

        return responseDto;
    }
}
