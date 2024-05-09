
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from 'src/users/users.interface';
import aqp from 'api-query-params';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { Permission, PermissionDocument } from './schema/permission.schema';



@Injectable()
export class PermissionsService {

  constructor(
    @InjectModel(Permission.name)
    private permissionModel: SoftDeleteModel<PermissionDocument>
  ) { }

  async create(createPermissionDto: CreatePermissionDto, user: IUser) {
    const {
       name, apiPath, method, module
    } = createPermissionDto;

    const isExist = await this.permissionModel.findOne({apiPath, method})

    if(isExist) {
      throw new BadRequestException("ApiPath and Methong is exist")
    }


    let newPermission = await this.permissionModel.create({
      name, apiPath, method, module,
      createdBy: {
        _id: user._id,
        email: user.email
      }
    })

    return {
      _id: newPermission?._id,
      createdAt: newPermission?.createdAt
      //createAt tự cập nhật date cho mình
    }

  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    //skip = offset
    let offset = (+currentPage - 1) * (+limit);
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = (await this.permissionModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit)

    //2 cách khác ép kiểu sort thành kiểu any
    // let { sort }= <{sort: any}>aqp(rq);
    //let { sort }: {sort: any}= aqp(rq);



    const result = await this.permissionModel.find(filter)
      .skip(offset)
      .limit(defaultLimit)
      // @ts-ignore: Unreachable code error
      .sort(sort)
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
    return this.permissionModel.findOne({
      _id: id
    });
  }

  findOneByUsername(name: string) {

    return this.permissionModel.findOne({
      name: name
    });
  }


  async update(id: string, updatePermissionDto: UpdatePermissionDto, user: IUser) {
    const updated = await this.permissionModel.updateOne(
      {
        _id: id
      },
      {
        ...updatePermissionDto,
        updatedBy: {
          _id: user._id,
          email: user.email
        },
      });

    return updated;
  }

  async remove(id: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id))
      return 'not found job';

    await this.permissionModel.updateOne({
      _id: id
    }, {
      deleteBy: {
        _id: id,
        email: user.email
      }
    })
    return this.permissionModel.softDelete({
      _id: id
    },
    );
  }
}

