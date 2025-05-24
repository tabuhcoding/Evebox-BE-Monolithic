import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService, ConfigModule } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";
import { SlackModule } from "src/infrastructure/adapters/slack/slack.module";
import { JwtStrategy } from "src/shared/strategies/jwt.strategy";
import { SendWelcomeEmailHandler } from "./modules/user/domain/events/handler/send-welcome-email.service";
import { RegisterUserController } from "./modules/user/commands/register/register-user.controller";
import { RegisterUserService } from "./modules/user/commands/register/register-user.service";
import { LoginUserController } from "./modules/user/commands/login/login-user.controller";
import { LoginUserService } from "./modules/user/commands/login/login-user.service";
import { EmailModule } from "src/infrastructure/adapters/email/email.module";
import { UserRepositoryImpl } from "./repository/users/user.repository.impl";
import { LogoutUserController } from "./modules/user/commands/logout/logout-user.controller";
import { LogoutUserService } from "./modules/user/commands/logout/logout-user.service";
import { RefreshTokenController } from "./modules/user/commands/refesh-token/refresh-token.controller";
import { RefreshTokenService } from "./modules/user/commands/refesh-token/refresh-token.service";
import { SendEmailOtpHandler } from "./modules/user/domain/events/handler/send-email-otp.handler";
import { ForgotPasswordController } from "./modules/user/commands/forgot-password/forgot-password.controller";
import { ForgotPasswordUserService } from "./modules/user/commands/forgot-password/forgot-password.service";
import { VerifyOTPController } from "./modules/user/commands/otps/verify-otp/verify-otp.controller";
import { VerifyOTPService } from "./modules/user/commands/otps/verify-otp/verify-otp.service";
import { ResetPasswordController } from "./modules/user/commands/reset-password/reset-password.controller";
import { ResetPasswordService } from "./modules/user/commands/reset-password/reset-password.service";
import { UserPasswordResetHandler } from "./modules/user/domain/events/handler/user-reset-password.handler";
import { LocalStorageModule } from "src/infrastructure/local-storage/local-storage.module";
import { OtpUtilsModule } from "src/shared/utils/otp/otp.module";
import { ResendOTPController } from "./modules/user/commands/otps/resend-otp/resend-otp.controller";
import { ResendOTPService } from "./modules/user/commands/otps/resend-otp/resend-otp.service";
import { GoogleStrategy } from "src/shared/strategies/google.strategy";
import { GoogleLoginController } from "./modules/user/commands/google-login/google-login.controller";
import { GoogleLoginService } from "./modules/user/commands/google-login/google-login.service";
import { GetUserController } from "./modules/user/queries/get-user/get-user.controller";
import { GetUserService } from "./modules/user/queries/get-user/get-user.service";
import { AddToFavoriteController } from "./modules/user/commands/add-to-favorite/create-favorite.controller";
import { FavoriteRepositoryImpl } from "./repository/favorite/favorite.impl";
import { AddToFavoriteService } from "./modules/user/commands/add-to-favorite/create-favorite.service";
import { UnfavoriteEventService } from "./modules/user/commands/unfavorite-event/unfavorite-event.service";
import { UnfavoriteOrgService } from "./modules/user/commands/unfavorite-org/unfavorite-org.service";
import { UnfavoriteEventController } from "./modules/user/commands/unfavorite-event/unfavorite-event.controller";
import { UnfavoriteOrgController } from "./modules/user/commands/unfavorite-org/unfavorite-org.controller";
import { CloudinaryModule } from "src/infrastructure/adapters/cloudinary/cloudinary.module";
import { ImagesController } from "./modules/images/commands/image.controller";
import { ImagesRepositoryImpl } from "./repository/images/images.impl";
import { ImagesService } from "./modules/images/commands/image.service";
import { UpdateUserController } from "./modules/user/commands/update-user/update-user.controller";
import { UpdateUserService } from "./modules/user/commands/update-user/update-user.service";
import { ChangePasswordController } from "./modules/user/commands/change-password/change-password.controller";
import { ChangePasswordService } from "./modules/user/commands/change-password/change-password.service";import { EventSvcModule } from "../event-svc/event-svc.module";
import { GetFavoriteEventService } from "./modules/user/queries/get-favorite-event/get-favorite-event.service";
import { GetFavoriteEventController } from "./modules/user/queries/get-favorite-event/get-favorite-event.controller";
import { GetFavoriteOrgService } from "./modules/user/queries/get-favorite-org/get-favorite-org.service";
import { GetFavoriteOrgController } from "./modules/user/queries/get-favorite-org/get-favorite-org.controller";
import { SetReceiveNotiController } from "./modules/user/commands/set-receive-noti/set-receive-noti.controller";
import { SetReceiveNotiService } from "./modules/user/commands/set-receive-noti/set-receive-noti.service";
import { TurnOnNotificationController } from "./modules/user/commands/turn-on-notification/turn-on-notification.controller";
import { TurnOnNotificationService } from "./modules/user/commands/turn-on-notification/turn-on-notification.service";
import { GetUsersNotifiedByEventController } from './modules/user/queries/get-notified-users-event/get-notified-users-event.controller';
import { GetUsersNotifiedByEventService } from "./modules/user/queries/get-notified-users-event/get-notified-users-event.service";
import { GetUsersNotifiedByOrgService } from "./modules/user/queries/get-notified-users-org/get-notified-users-org.service";
import { GetUsersNotifiedByOrgController } from "./modules/user/queries/get-notified-users-org/get-notified-users-org.controller";


@Module({
  imports: [
    ConfigModule,
    CqrsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
    EmailModule,
    LocalStorageModule,
    OtpUtilsModule,
    CloudinaryModule,
    SlackModule,
    EventSvcModule,
  ],
  controllers: [
    ResendOTPController,
    ResetPasswordController,
    VerifyOTPController,
    RegisterUserController,
    LoginUserController,
    LogoutUserController,
    RefreshTokenController,
    ForgotPasswordController,
    GoogleLoginController,
    GetUserController,
    AddToFavoriteController,
    UnfavoriteEventController,
    UnfavoriteOrgController,
    ImagesController,
    UpdateUserController,
    ChangePasswordController,
    GetFavoriteEventController,
    GetFavoriteOrgController,
    SetReceiveNotiController,
    TurnOnNotificationController, 
    GetUsersNotifiedByEventController,
    GetUsersNotifiedByOrgController
  ],
  providers: [
    RegisterUserService,
    LoginUserService,
    LogoutUserService,
    SendWelcomeEmailHandler,
    UserRepositoryImpl,
    JwtStrategy,
    GoogleStrategy,
    RefreshTokenService,
    SendEmailOtpHandler,
    ForgotPasswordUserService,
    VerifyOTPService,
    ResetPasswordService,
    UserPasswordResetHandler,
    ResendOTPService,
    GoogleLoginService,
    GetUserService,
    AddToFavoriteService,
    UnfavoriteEventService,
    UnfavoriteOrgService,
    GetFavoriteEventService,
    GetFavoriteOrgService,
    {
      provide: 'FavoriteRepository',
      useClass: FavoriteRepositoryImpl,
    },
    ImagesService,
    {
      provide: 'ImagesRepository',
      useClass: ImagesRepositoryImpl,
    },
    UpdateUserService, 
    {
      provide: 'UserRepository',
      useClass: UserRepositoryImpl
    },
    ChangePasswordService,
    SetReceiveNotiService,
    TurnOnNotificationService,
    GetUsersNotifiedByEventService,
    GetUsersNotifiedByOrgService
  ],
  exports: [
    UserRepositoryImpl,
  ],
})
export class UserModule { }