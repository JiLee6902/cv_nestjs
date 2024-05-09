import { Controller, Get, Render, Post, UseGuards, Body, Res, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AppService } from 'src/app.service';
import { AuthService } from './auth.service';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { LocalAuthGuard } from './local-auth.guard';
import { RegisterUserDto, UserLoginDto } from 'src/users/dto/create-user.dto';
import { Request, Response } from 'express';
import { IUser } from 'src/users/users.interface';
import { RolesService } from 'src/roles/roles.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private rolesService: RolesService
  ) { }


  @Public()
  @UseGuards(LocalAuthGuard)
  //chặn số lần gọi endpoint quá nhiều
  @UseGuards(ThrottlerGuard)
  @ResponseMessage("User Login")
  //do dùng passport (username và password do thư viện này tự cấp)
  // nên trong api kh có phần body nên phải tự thêm vô
  @ApiBody({type: UserLoginDto})
  @Post('/login')
  async login(
    @Req() req,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.login(req.user, response);
    return result;
  }

  @Public()
  @ResponseMessage("Register a new user")
  @Post('/register')
  async register(
    @Body() registerUserDto: RegisterUserDto
  ) {
    return this.authService.register(registerUserDto);
  }


  // khi lấy user ở đây nó kh giống với req.user sau khi login trả về
  @ResponseMessage("Get user information")
  @Get('/account')
  async handleGetAccount(
    @User() user: IUser
  ) {
    const temp = await this.rolesService.findOne(user.role._id) as any

    //có 2 dữ kiện nên nó yêu cầu set any
    //temp là ở dang Promise nên set nó any để truy
    //permissions ở server là mảng objectId(type ObjetId)
    user.permissions = temp.permissions;


    return { temp };
  }

  //accesstoken hết hạn => req.user = null + kh có jwt
  // nên thành ra để public để kh check (vì vẫn chưa logout)
  //refreshtoken vẫn còn thời hạn, vì có refresh nên mới lấy được accesstoken mới
  //gọi api để làm mới accesstoken cũng tương đương tạo mới token 
  //khác ở chỗ đã đăng nhập
  @Public()
  @ResponseMessage("Get user by refresh token")
  @Get('/refresh')
  handleRefreshToken(
    @Req() request: Request,
    @User() user: IUser,
    @Res({ passthrough: true }) response: Response
  ) {
    const refreshToken = request.cookies["refresh_token"]
    return this.authService.processNewToken(refreshToken, response);
  }


  @ResponseMessage("Logout User")
  @Get('/logout')
  handleLogout(

    @User() user: IUser,
    @Res({ passthrough: true }) response: Response
  ) {

    return this.authService.logout(response, user);
  }
}
