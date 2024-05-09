import { BadRequestException, Inject, Injectable, UnauthorizedException, forwardRef } from '@nestjs/common';
import { CreateUserDto, RegisterUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User as UserM, UserDocument } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { genSaltSync, hashSync, compareSync } from 'bcryptjs';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose/dist/soft-delete-model';
import { AuthService } from 'src/auth/auth.service';
import aqp from 'api-query-params'
import { IUser } from './users.interface';
import { ResponseMessage, User } from 'src/decorator/customize';
import { response } from 'express';
import { USER_ROLE } from 'src/databases/sample';
import { Role, RoleDocument } from 'src/roles/schema/role.schema';
import { RolesService } from 'src/roles/roles.service';


@Injectable()
export class UsersService {

  constructor(
    @InjectModel(UserM.name)
    private userModel: SoftDeleteModel<UserDocument>,

    @InjectModel(Role.name)
    private roleModel: SoftDeleteModel<RoleDocument>,
   
  ) { }

  getHashPassword = (password: string) => {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  }

  async register(user: RegisterUserDto) {
    const { name, email, password, age, gender, address } = user;

    const isExist = await this.userModel.findOne({ email })
    if (isExist) {
      throw new BadRequestException(`The email ${email} exist. Please use another email!`)
    }

    const userRole = await this.roleModel.findOne({name: USER_ROLE})
   //const userRole = await this.roleService.findOne("6639285c3b63f5e42d6ed667") as any
   
    const hashPassword = this.getHashPassword(password);
    let newRegister = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      age,
      gender,
      address,
      role: userRole?._id
    })
    return newRegister;
  }

  async create(createUserDto: CreateUserDto, user: IUser) {
    const { name, email, password, age, gender, address, role, company } = createUserDto;

    const isExist = await this.userModel.findOne({ email })
    if (isExist) {
      throw new BadRequestException(`The email ${email} exist. Please use another email!`)
    }

    const hashPassword = this.getHashPassword(password);
    let newUser = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      age,
      gender,
      address,
      role,
      company,
      createdBy: {
        _id: user._id,
        email: user.email
      }
    })
    return newUser;
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    //skip = offset
    let offset = (+currentPage - 1) * (+limit);
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit)

    //2 cách khác ép kiểu sort thành kiểu any
    // let { sort }= <{sort: any}>aqp(rq);
    //let { sort }: {sort: any}= aqp(rq);



    const result = await this.userModel.find(filter)
      .skip(offset)
      .limit(defaultLimit)
      // @ts-ignore: Unreachable code error
      .sort(sort)
      .select("-password")
      .populate(population)
      .exec();

    //  if (isEmpty(sort)) {

    // @ts-ignore: Unreachable code error
    // sort = "-updatedAt"
    //  }
    return {
      meta: {
        current: currentPage, //trang hiện tại
        pageSize: limit, //số lượng bản ghi đã lấy
        pages: totalPages, //tổng số trang với điều kiện query
        total: totalItems // tổng số phần tử (số bản ghi)
      },
      result,

      //kết quả query
    }


  }

  findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id))
      return 'not found user';
    return this.userModel.findOne({
      _id: id
    })
    .populate({path: "role", select: {name: 1, _id: 1}})
    .select("-password");
  }


//check khi login
//trước khi login vô đã lấy được role rồi
  findOneByUsername(username: string) {
    return this.userModel.findOne({
      email: username
    }).populate({path: "role", select: {name: 1}})
  }

  isValidPassword(password: string, hash: string) {
    return compareSync(password, hash)
  }

  async update(updateUserDto: UpdateUserDto, user: IUser) {
    const updated = await this.userModel.updateOne(
      {
        _id: updateUserDto._id
      },
      {
        ...updateUserDto,
        updatedBy: {
          _id: user._id,
          email: user.email
        }
      });

    return updated;
  }

  async remove(id: string, user: IUser) {
    //admin@gmail.com


    if (!mongoose.Types.ObjectId.isValid(id))
      return 'not found user';

    const foundUser = await this.userModel.findById(id);
    if (foundUser && foundUser.email === "admin@gmail.com") {
      throw new BadRequestException("Can't delete admin account!")
    }

    await this.userModel.updateOne({
      _id: id
    }, {
      deleteBy: {
        _id: user._id,
        email: user.email
      }
    })
    return this.userModel.softDelete({
      _id: id
    });
  }

  updateUserToken = async (refreshToken: string, _id: string) => {
    return await this.userModel.updateOne(
      {
        _id: _id
      }, { refreshToken }
    )
  }

  findUserByToken = async (refreshToken: string) => {
   return  await this.userModel.findOne(
      { refreshToken }
    ).populate({
      path: "role",
      select: {name: 1}
    })
  }

  
}
