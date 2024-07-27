import { Request } from "express";
import { Users } from "src/database/entities/user.entity";
import { UserResponseDto } from "src/users/dto/user.dto";

export interface AuthenticatedUser extends Users {
  error?: any;
  sub: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  newTokens?: { accessToken: string; refreshToken: string };
}

export interface FindOrCreateUserByGithubResponse {
  user: UserResponseDto;
  githubAccessToken: string;
  githubRefreshToken: string;
}

