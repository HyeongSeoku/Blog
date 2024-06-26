import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Posts } from "./posts.entity";
import { Users } from "./user.entity";

@Entity("comments")
export class Comments {
  @PrimaryGeneratedColumn({ name: "comment_id" })
  commentId: number;

  @Column({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "updated_at" })
  updatedAt: Date;

  @Column()
  content: string;

  @ManyToOne(() => Posts)
  @JoinColumn({ name: "post_id" })
  post: Posts;

  @Column({
    type: "tinyint",
    name: "is_deleted",
    transformer: {
      to: (value: boolean) => (value ? 1 : 0),
      from: (value: number) => value === 1,
    },
  })
  isDeleted: boolean;

  @Column({ name: "deleted_by", nullable: true, default: () => "NULL" })
  deletedBy: string | null;

  @Column({
    type: "tinyint",
    name: "is_anonymous",
    transformer: {
      to: (value: boolean) => (value ? 1 : 0),
      from: (value: number) => value === 1,
    },
  })
  isAnonymous: boolean;

  @Column({
    type: "tinyint",
    name: "is_post_owner",
    transformer: {
      to: (value: boolean) => (value ? 1 : 0),
      from: (value: number) => value === 1,
    },
  })
  isPostOwner: boolean;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: "user_id" })
  user: Users | null;

  @OneToMany(() => Comments, (comments) => comments.parent)
  replies: Comments[];

  @ManyToOne(() => Comments, (comments) => comments.replies)
  @JoinColumn({ name: "parents_comment_id" })
  parent: Comments;
}
