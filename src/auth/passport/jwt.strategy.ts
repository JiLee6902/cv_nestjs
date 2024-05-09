import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from '../constants';
import { ConfigService } from '@nestjs/config';
import { IUser } from 'src/users/users.interface';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private rolesService : RolesService
    ) {
        //để lấy access token ở trên thanh header và undecoded
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>("JWT_ACCESS_TOKEN"),
        });
    }

    // để public kh check qua này
    // gán req.user = validate(payload)
    //payload này là từ login đẩy vào, trong access_token của login
    async validate(payload: IUser) {
        const { _id, name, email, role} = payload;
       
        const userRole = role as unknown as { _id: string; name: string }
        const temp = await this.rolesService.findOne(userRole._id) as any

        return {
            _id,
            name,
            email,
            role,
            permissions: temp?.permissions ?? []
            
        }
        // <=> req.user
    }
}