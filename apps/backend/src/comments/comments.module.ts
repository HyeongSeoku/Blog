import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { PostsModule } from 'src/posts/posts.module';
import SharedModule from 'src/shared/shared.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Posts } from 'src/database/entities/posts.entity';
import { Comments } from 'src/database/entities/comments.entity';
import { PostCommentOwnerGuard } from 'src/guards/post-comment-owner.guard';
import { CommentOwnerGuard } from 'src/guards/comment-owner.guard';
import { PostOwnerGuard } from 'src/guards/postOwner.guard';
import { UsersService } from 'src/users/users.service';
import { Users } from 'src/database/entities/user.entity';

@Module({
  imports: [
    PostsModule,
    SharedModule,
    TypeOrmModule.forFeature([Posts, Comments, Users]),
  ],
  controllers: [CommentsController],
  providers: [
    UsersService,
    CommentsService,
    PostCommentOwnerGuard,
    CommentOwnerGuard,
    PostOwnerGuard,
  ],
})
export class CommentsModule {}
