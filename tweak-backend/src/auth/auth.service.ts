import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  comparePasswords,
  generateHashPassword,
} from 'src/shared/utils/bcrypt.utils';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { UserDto } from './dto/user.dto';
import { JwtPayload } from './jwt-payload.interface';
import {
  DEFAULT_USER_SETTINGS,
  User,
  UserDocument,
} from './schema/user.schema';

type AuthResponse = {
  accessToken: string;
  user: {
    username: string;
    language: string;
    weekStartsOn: string;
    dateFormat: string;
  };
};

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) { }

  async signupWithUsernamePassword(
    createUserDto: CreateUserDto,
  ): Promise<AuthResponse> {
    try {
      const { username, password } = createUserDto;
      const isExists = await this.userModel.findOne({
        username: createUserDto.username,
      });
      if (isExists) throw new ConflictException(`Username already exists!`);
      const { data, error } = await generateHashPassword(
        createUserDto.password,
      );
      if (error) throw error;

      const user = new this.userModel({
        username,
        password: data,
        ...DEFAULT_USER_SETTINGS,
      });
      await user.save();
      const payload: JwtPayload = { username };
      const accessToken: string = this.jwtService.sign(payload);
      return this.buildAuthResponse(user, accessToken);
    } catch (error: any) {
      throw error;
    }
  }

  async loginWithUsernamePassword(
    filterUserParams: FilterQuery<UserDto>,
  ): Promise<AuthResponse> {
    try {
      const { username, password } = filterUserParams;
      const isExists = await this.userModel.findOne({
        username: username,
      });
      if (!isExists)
        throw new NotFoundException(`${username} does not exists!`);
      const { data, error } = await comparePasswords(
        isExists.password,
        password,
      );
      if (error) throw error;

      if (!data)
        throw new UnauthorizedException(`Username / password does not matched`);

      const payload: JwtPayload = { username };
      const accessToken: string = this.jwtService.sign(payload);
      return this.buildAuthResponse(isExists, accessToken);
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser(username: string) {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException(`${username} does not exists!`);
    }

    return this.serializeUser(user);
  }

  async updateCurrentUserSettings(
    username: string,
    updateUserSettingsDto: UpdateUserSettingsDto,
  ) {
    if (!Object.keys(updateUserSettingsDto).length) {
      throw new BadRequestException('No settings provided');
    }

    const user = await this.userModel.findOneAndUpdate(
      { username },
      { $set: updateUserSettingsDto },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException(`${username} does not exists!`);
    }

    return this.serializeUser(user);
  }

  private buildAuthResponse(user: UserDocument, accessToken: string): AuthResponse {
    return {
      accessToken,
      user: this.serializeUser(user),
    };
  }

  private serializeUser(user: UserDocument) {
    return {
      username: user.username,
      language: user.language || DEFAULT_USER_SETTINGS.language,
      weekStartsOn: user.weekStartsOn || DEFAULT_USER_SETTINGS.weekStartsOn,
      dateFormat: user.dateFormat || DEFAULT_USER_SETTINGS.dateFormat,
    };
  }
}
