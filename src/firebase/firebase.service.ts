import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseService.name);
    private firebaseApp: admin.app.App;

    constructor(private readonly configService: ConfigService) {}

    onModuleInit() {
        this.initializeFirebase();
    }

    private initializeFirebase() {
        try {
            const serviceAccountBase64 = this.configService.get<string>(
                'FIREBASE_SERVICE_ACCOUNT_BASE64',
            );

            if (!serviceAccountBase64) {
                throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set');
            }

            // Decode base64 to JSON
            // [Convert]::ToBase64String([IO.File]::ReadAllBytes("firebase-adminsdk.json"))

            const serviceAccount = JSON.parse(
                Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'),
            ) as ServiceAccount;

            this.firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });

            this.logger.log('Firebase Admin SDK initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Firebase Admin SDK', error);
            throw error;
        }
    }

    getAuth(): admin.auth.Auth {
        return this.firebaseApp.auth();
    }

    async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
        return this.getAuth().verifyIdToken(idToken);
    }
}
