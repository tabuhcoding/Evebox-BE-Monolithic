import { AggregateRoot } from 'src/libs/ddd/aggregate-root.base';
import { Result, Ok, Err } from 'oxide.ts';
import { OTPId } from '../value-objects/otp/otp-id.vo';
import { Email } from '../value-objects/user/email.vo';
import { SendEmailOTPDomainEvent } from '../events/user/send-email-otp.domain-event';
import { OTPType } from '../enums/otp-type.enum';
import { OTPConstants } from 'src/shared/constants/constants';

interface OTPProps {
    id: OTPId;
    email: Email;
    otp: string;
    type: OTPType;
    expiresAt: Date;
    isUsed: boolean;
    createdAt: Date;
    attempts: number;
    resendCooldown: number;
  }
  
  export class OTP extends AggregateRoot<OTPId, OTPProps> {
    private static readonly MAX_ATTEMPTS = OTPConstants.MAX_ATTEMPTS;
    private static readonly RESEND_COOLDOWN = OTPConstants.RESEND_COOLDOWN; // seconds

    private constructor(id: OTPId, props: OTPProps) {
      super(id, props);
    }

    public static generateOTP(): string {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }

    public static create(
      email: Email,
      type: OTPType
    ): Result<OTP, Error> {
      try {
        const id = OTPId.generate();
        const otp = OTP.generateOTP();  
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
  
        const otpEntity = new OTP(id, {
          id,
          email,
          otp,
          type,
          expiresAt,
          isUsed: false,
          createdAt: new Date(),
          attempts: 0,
          resendCooldown: OTP.RESEND_COOLDOWN,
        });
  
        otpEntity.addDomainEvent(
          new SendEmailOTPDomainEvent(
            email.value,
            otp,
            type,
            expiresAt
          )
        );

        
  
        return Ok(otpEntity);
      } catch (error) {
        return Err(new Error('Failed to create OTP'));
      }
    }
  
    // Getters
    public get email(): Email {
      return this.props.email;
    }
  
    public get otp(): string {
      return this.props.otp;
    }
  
    public get type(): OTPType {
      return this.props.type;
    }
  
    public get expiresAt(): Date {
      return this.props.expiresAt;
    }
  
    public get isUsed(): boolean {
      return this.props.isUsed;
    }
  
    public get createdAt(): Date {
      return this.props.createdAt;
    }

    public get attempts(): number {
      return this.props.attempts;
    }

    public get resendCooldown(): number {
      return this.props.resendCooldown;
    }

    public set otp(value: string) {
      this.props.otp = value;
    }
  
    public canAttempt(): boolean {
      return this.props.attempts < OTP.MAX_ATTEMPTS;
    }
  
    public getRemainingAttempts(): number {
      return OTP.MAX_ATTEMPTS - this.props.attempts;
    }
  
    public incrementAttempt(): Result<void, Error> {
      if (!this.canAttempt()) {
        return Err(new Error('Maximum attempts exceeded'));
      }
      this.props.attempts += 1;
      return Ok(void 0);
    }
  
    public isValid(): boolean {
      return !this.props.isUsed && new Date() < this.props.expiresAt;
    }
  
    public markAsUsed(): Result<void, Error> {
      if (!this.isValid()) {
        return Err(new Error('OTP is invalid or expired'));
      }
      this.props.isUsed = true;
      return Ok(void 0);
    }
  
    // For persistence
    public static createExisting(
      id: OTPId,
      email: Email,
      otp: string,
      type: OTPType,
      expiresAt: Date,
      isUsed: boolean,
      createdAt: Date,
      attempts: number = 0,
    ): Result<OTP, Error> {
      return Ok(new OTP(id, {
        id,
        email,
        otp,
        type,
        expiresAt,
        isUsed,
        createdAt,
        attempts,
        resendCooldown: OTP.RESEND_COOLDOWN,
      }));
    }
  }