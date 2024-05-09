import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/users/users.interface';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { genSaltSync, hashSync } from 'bcryptjs';
import { Model } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import { Response } from 'express';
import { RolesService } from 'src/roles/roles.service';
// nếu sai thì from express

@Injectable()
export class AuthService {

    constructor(

        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private rolesService: RolesService
    ) { }



    getHashPassword = (password: string) => {
        const salt = genSaltSync(10);
        const hash = hashSync(password, salt);
        return hash;
    }

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.usersService.findOneByUsername(username) as any;

        //user là một promise
        if (user) {
            const isValid = this.usersService.isValidPassword(pass, user.password);
            if (isValid === true) {
                //lấy ra role mục đích có name của role và cả id để tìm ra permission
                const userRole = user.role as unknown as { _id: string; name: string }
                const temp = await this.rolesService.findOne(userRole._id) as any

                const objUser = {
                    ...user.toObject(),
                    permissions: temp?.permissions ?? []
                }

                return objUser;
            }

        }
        return null;
    }

    //pay là jwt
    async login(user: IUser, response: Response) {
        //role này đã populate nên refreshtoken cũng cần populate
        const { _id, name, email, role, permissions } = user;
        const payload = {
            sub: "token login",
            iss: "from server",
            _id,
            name,
            email,
            role,

        };

        //tạo mới mỗi khi ng dùng login và vẫn duy trì đăng nhập 
        // cho tới khi người dùng logout
        const refresh_token = this.createRefreshToken(payload);

        //khi login tạo ra cả 2 token
        //mỗi lần login sẽ tạo ra 1 token mới
        //update để lưu vào database và check xem đúng refresh token của user đó không
        await this.usersService.updateUserToken(refresh_token, _id)

        //set refresh_token vào cookie
        response.cookie('refresh_token', refresh_token, {
            httpOnly: true,
            maxAge: ms(this.configService.get<string>("JWT_REFRESH_EXPIRE"))
        });

        //set refresh_token vào cookie
        return {

            access_token: this.jwtService.sign(payload),
            user: {
                _id,
                name,
                email,
                role,
                permissions
            }

        };
    }
    createRefreshToken = (payload: any) => {
        const refresh_token = this.jwtService.sign(payload,
            {
                secret: this.configService.get<string>('JWT_REFRESH_TOKEN'),
                expiresIn: ms(this.configService.get<string>("JWT_REFRESH_EXPIRE")) / 1000
            }
        )
        return refresh_token;

    }


    async register(user: RegisterUserDto) {
        let newUser = await this.usersService.register(user);
        return {
            data: {
                _id: newUser?._id,
                createdAt: newUser?.createdAt
            }
        };
    }


    processNewToken = async (refresh_token: string, response: Response) => {
        try {
            let a = this.jwtService.verify(refresh_token, {
                secret: this.configService.get<string>('JWT_REFRESH_TOKEN')
            })

            //chọc xuống database lấy user có refresh token v
            let user = await this.usersService.findUserByToken(refresh_token);
            const userRole = user.role as unknown as { _id: string; name: string }
            const temp = await this.rolesService.findOne(userRole._id) as any


            if (user) {
                //update refresh token
                const { _id, name, email, role } = user;
                const payload = {
                    sub: "token refresh",
                    iss: "from server",
                    _id,
                    name,
                    email,
                    role,

                };

                //tạo mới mỗi khi ng dùng login và vẫn duy trì đăng nhập 
                // cho tới khi người dùng logout
                const refresh_token = this.createRefreshToken(payload);

                //khi login tạo ra cả 2 token

                //update để lưu vào database và check xem đúng refresh token của user đó không
                await this.usersService.updateUserToken(refresh_token, _id.toString())



                response.clearCookie("refresh_token")

                //set refresh_token vào cookie
                response.cookie('refresh_token', refresh_token, {
                    httpOnly: true,
                    maxAge: ms(this.configService.get<string>("JWT_REFRESH_EXPIRE"))
                });

                //set refresh_token vào cookie
                return {

                    access_token: this.jwtService.sign(payload),
                    user: {
                        _id,
                        name,
                        email,
                        role,
                        permissions: temp?.permissions ?? []
                    }

                };
            } else {
                throw new BadRequestException('Refresh token invalid. Please login again')

            }
        } catch {
            throw new BadRequestException('Refresh token invalid. Please login again')
        }
    }

    logout = async (response: Response, user: IUser) => {
        await this.usersService.updateUserToken("", user._id);
        response.clearCookie("refresh_token");
        return "ok";
    }
}