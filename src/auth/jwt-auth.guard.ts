import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY, IS_PUBLIC_PERMISSION } from 'src/decorator/customize';
import { Request } from 'express'


@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }


  //cho login kh check jwt
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      //lấy ra value của key: IS_PUBLIC_KEY  
      context.getHandler(),
      context.getClass(),
    ]);
    //có public sẽ bỏ qua phần handleRequest tại vì trả về true nên out khỏi function
    if (isPublic) {
      return true;
    }
    //kiểm tra xem jwt hợp lệ hay không
    return super.canActivate(context);
  }

  //không có public thì sẽ chạy vào hàm này
  //server sẽ chạy jwt.strategy để xem token có đúng kh 
  //đúng thì trả req.user sai thì thông báo lỗi
  handleRequest(err, user, info, context: ExecutionContext) {
    const request: Request = context.switchToHttp().getRequest();

    const isSkipPermission =  this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_PERMISSION, [
      //lấy ra value của key: IS_PUBLIC_KEY  
      context.getHandler(),
      context.getClass(),
    ]);
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new UnauthorizedException("Token not valid!");
    }

    //check permission
    const targetMethod = request.method
    const targetEndpoint = request.route?.path as string

    const permissions = user?.permissions ?? [];

    let isExist = permissions.find(permission =>
      targetEndpoint === permission.apiPath
      &&
      targetMethod === permission.method
    )

    if (targetEndpoint.startsWith("/api/v1/auth")) { isExist = true; }
    if (!isExist && !isSkipPermission) {
      throw err || new ForbiddenException("Don't have power access to this permission!");
    }

    return user;
  }
}