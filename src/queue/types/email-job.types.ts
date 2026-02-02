export enum EmailJobType {
    WELCOME = 'welcome',
    PASSWORD_RESET_SUCCESS = 'password-reset-success',
    EMAIL_VERIFICATION = 'email-verification',
    FORGOT_PASSWORD_OTP = 'forgot-password-otp',
}

export interface WelcomeEmailJob {
    email: string;
    appUrl?: string;
}

export interface PasswordResetSuccessEmailJob {
    email: string;
}

export interface EmailVerificationJob {
    email: string;
    otp: string;
}

export interface ForgotPasswordOtpJob {
    email: string;
    otp: string;
}

export type EmailJobData =
    | { type: EmailJobType.WELCOME; data: WelcomeEmailJob }
    | { type: EmailJobType.PASSWORD_RESET_SUCCESS; data: PasswordResetSuccessEmailJob }
    | { type: EmailJobType.EMAIL_VERIFICATION; data: EmailVerificationJob }
    | { type: EmailJobType.FORGOT_PASSWORD_OTP; data: ForgotPasswordOtpJob };
