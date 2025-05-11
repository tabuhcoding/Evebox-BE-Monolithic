export class OTPConstants {
    static readonly MAX_ATTEMPTS = 5;
    static readonly RESEND_COOLDOWN = 60;
}

export const USER_MESSAGES = {
    SUCCESS: {
        LOGIN: 'Login successful',
        REGISTER: 'OTP has been sent to your email',
        LOGOUT: 'Logout successful',
        USER_FETCHED: 'User details fetched successfully',
        PASSWORD_RESET: 'Password reset successful',
        OTP_VERIFIED: 'OTP verified successfully',
        OTP_SENT: 'OTP has been sent to your email',
        OTP_RESENT: 'OTP has been resent to your email'
    },
    ERRORS: {
        USER_NOT_FOUND: 'User not found',
        INVALID_CREDENTIALS: 'Invalid credentials',
        EMAIL_EXISTS: 'User with this email already exists',
        PASSWORDS_MISMATCH: 'Passwords do not match',
        INVALID_OTP: 'Invalid OTP',
        OTP_EXPIRED: 'OTP has expired',
        REGISTER_ERROR: 'An unexpected error occurred during registration',
        SERVER_ERROR: 'An unexpected error occurred',
        FAILED_CREATE_USER: 'Failed to create new user',
        LOGOUT_FAILED: (error: string) => `'Failed to logout: ' + ${error})`,
        RESET_PASSWORD_FAILED: 'Failed to reset password',
        LOGIN_FAILED: 'Email or password is incorrect',
      }
};

export const OTP_MESSAGES = {
    SUCCESS: {
      VERIFIED: 'OTP verified successfully',
      FORGOT_PASSWORD: 'You can now reset your password',
      REGISTER: 'Email verified successfully. You can now complete registration',
    },
    ERRORS: {
      TYPE_REQUIRED: 'OTP type is required',
      INVALID_OR_EXPIRED: (attempts: number) => `Invalid or expired OTP. You have ${attempts} attempts left.`,
      MAX_ATTEMPTS_REACHED: 'Maximum attempts reached. Please request a new OTP.',
      USER_NOT_FOUND: 'User not found',
      LOCAL_STORAGE_USER_NOT_FOUND: 'User not found in local storage',
      INVALID_TYPE: 'Invalid OTP type',
      INVALID_REQUEST_TOKEN: 'Invalid request token',
    }
  };

export const REFRESH_TOKEN_MESSAGES = {
  SUCCESS: {
    REFRESHED: 'Token refreshed successfully',
  },
  ERRORS: {
    MISSING_REFRESH_TOKEN: "Missing refresh token",
    FAILED_REFRESH_TOKEN: "Failed to refresh token",
  }
};

export const RESET_TOKEN_MESSAGES = {
  ERRORS: {
    INVALID_RESET_TOKEN: 'Invalid reset token',
  }
};
  
export const OTP_VALIDATION = {
  MAX_ATTEMPTS: 5,
  TOKEN_LENGTH: 6,
  EXPIRY_TIME: 900, // 15 minutes in seconds
};
  