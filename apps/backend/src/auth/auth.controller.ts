import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  NotFoundException,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import {
  ChangePasswordDto,
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
} from 'src/users/dto/user.dto';
import { UsersService } from 'src/users/users.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthenticatedRequest } from './auth.interface';
import { RateLimit } from 'nestjs-rate-limiter';
import { Request as ExpressRequest, Response } from 'express';
import { REFRESH_TOKEN_EXPIRE_TIME } from 'src/constants/auth.constants';
import { REFRESH_TOKEN_KEY } from 'src/constants/cookie.constants';
import { Users } from 'src/database/entities/user.entity';
import { RefreshTokenService } from 'src/refresh-token/refresh-token.service';
import { GithubAuthGuard } from 'src/guards/github-auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private omitPassword(user: UserResponseDto): Partial<Users> {
    const { password, ...result } = user;
    return result;
  }

  constructor(
    private authService: AuthService,
    private readonly usersService: UsersService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  @RateLimit({ points: 10, duration: 60 })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const { user } = req;

    const loginResult = await this.authService.login(user);
    if (!loginResult) throw new UnauthorizedException('Login failed');

    const { accessToken, lastLogin, refreshToken } = loginResult;

    const refreshTokenExpires = new Date().setDate(
      new Date().getDate() + REFRESH_TOKEN_EXPIRE_TIME,
    );

    res.cookie(REFRESH_TOKEN_KEY, refreshToken, {
      httpOnly: true,
      expires: new Date(refreshTokenExpires),
    });

    return res.status(200).json({ accessToken, lastLogin });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const userId = req?.user?.userId;
    if (!userId)
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: 'User not authenticated' });

    const result = await this.authService.logout(userId);

    if (result) {
      res.cookie(REFRESH_TOKEN_KEY, '', {
        httpOnly: true,
        expires: new Date(0),
      });
      return res
        .status(HttpStatus.OK)
        .json({ message: 'Logged out successfully' });
    } else {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Logged out failed' });
    }
  }

  @Post('refresh')
  async refreshTokens(@Req() req: ExpressRequest, @Res() res: Response) {
    const refreshToken = req.cookies[REFRESH_TOKEN_KEY];
    if (!refreshToken) throw new NotFoundException('refreshToken is not exist');

    const generateResult =
      await this.authService.generateNewAccessTokenByRefreshToken(refreshToken);

    if (!generateResult)
      throw new UnauthorizedException('Invalid refreshToken');

    const { newAccessToken, newRefreshToken } = generateResult;

    const refreshTokenExpires = new Date().setDate(
      new Date().getDate() + REFRESH_TOKEN_EXPIRE_TIME,
    );

    res.cookie(REFRESH_TOKEN_KEY, newRefreshToken, {
      httpOnly: true,
      expires: new Date(refreshTokenExpires),
    });

    return res.status(200).json({ accessToken: newAccessToken });
  }

  @RateLimit({ points: 2, duration: 60 })
  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.createUser(createUserDto);
    return { user: this.omitPassword(user) };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest) {
    const { userId } = req?.user;
    const userData = await this.usersService.findById(userId);

    const { password, ...result } = userData;
    if (!userData)
      throw new UnauthorizedException(`${userId} is not valid user`);
    return result;
  }

  //FIXME: 유효하지 않은 유저에 대해 LocalAuthGuard 내에서 에러 로그 및 반환값 처리 필요
  @UseGuards(LocalAuthGuard)
  @Delete('withdrawal')
  async deleteUser(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user?.userId;
    await this.usersService.deleteUser(userId);
    res.status(HttpStatus.OK).json({ message: 'delete user success' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user.userId;
    const refreshToken = req.cookies[REFRESH_TOKEN_KEY];

    await this.usersService.changePassword(userId, changePasswordDto);

    await this.refreshTokenService.deleteToken(refreshToken);

    res
      .status(HttpStatus.OK)
      .json({ message: 'Password successfully changed', accessToken: '' });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update')
  async updateUser(
    @Req() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
    @Res() res: Response,
  ) {
    return await this.usersService.update(req?.user.userId, updateUserDto);
  }

  @UseGuards(GithubAuthGuard)
  @Get('github/callback')
  async githubAuthRedirect(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    // 성공적인 인증 후 사용자 객체는 요청에 첨부됩니다.
    // 이제 세션을 생성하거나 JWT를 발급할 수 있습니다.
    if (!req.user) {
      res.redirect('/login'); // 로그인 실패를 처리하는 프론트엔드 경로로 리다이렉트
    } else {
      // 사용자에게 토큰을 발급하는 방법을 가정하고 있습니다.
      const { accessToken, refreshToken } =
        await this.authService.generateToken(req.user);
      // 토큰을 전달하는 프론트엔드 경로로 리다이렉트

      console.log('TEST', accessToken);
      res.redirect(
        `${process.env.FE_BASE_URL}/github-login/success?token=${accessToken}`,
      );
    }
  }
}
