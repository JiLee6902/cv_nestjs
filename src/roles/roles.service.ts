
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from 'src/users/users.interface';
import aqp from 'api-query-params';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { Role, RoleDocument } from './schema/role.schema';
import { ADMIN_ROLE } from 'src/databases/sample';


@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name)
    private roleModel: SoftDeleteModel<RoleDocument>
  ) { }

  async create(createRoleDto: CreateRoleDto, user: IUser) {
    const {
      name, description, isActive, permissions
    } = createRoleDto

    const isExist = await this.roleModel.findOne({ name })

    if (isExist) {
      throw new BadRequestException("Role with this name is exist")
    }


    let newRole = await this.roleModel.create({
      name, description, isActive, permissions,
      createdBy: {
        _id: user._id,
        email: user.email
      }
    })

    return {
      _id: newRole?._id,
      createdAt: newRole?.createdAt
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

    const totalItems = (await this.roleModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit)

    //2 cách khác ép kiểu sort thành kiểu any
    // let { sort }= <{sort: any}>aqp(rq);
    //let { sort }: {sort: any}= aqp(rq);



    const result = await this.roleModel.find(filter)
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

  //khi từ bên ngoài gọi hàm findOne trong role để xử lí
  //Hàm xử lí có populate giống dưới đây thì mongoose có khả năng trả về một promist hoặc một mongoose document
  //cần set as any đối với đối tượng bên ngoài gọi hàm nay
  findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id))
      return 'not found this role';
    return this.roleModel.findOne({
      _id: id
    }).populate({ path: "permissions", select: { _id: 1, apiPath: 1, name: 1, method: 1, module: 1 } })
  }

  findOneByUsername(name: string) {

    return this.roleModel.findOne({
      name: name
    });
  }


  async update(id: string, updateRoleDto: UpdateRoleDto, user: IUser) {
    const updated = await this.roleModel.updateOne(
      {
        _id: id
      },
      {
        ...updateRoleDto,
        updatedBy: {
          _id: user._id,
          email: user.email
        }
      });

    return updated;
  }

  async remove(id: string, user: IUser) {

    const foundRole = await this.roleModel.findById(id);
    if (foundRole.name === ADMIN_ROLE) {
      throw new BadRequestException("Can't removw role Admin!")
    }

    if (!mongoose.Types.ObjectId.isValid(id))
      return 'not found job';

    await this.roleModel.updateOne({
      _id: id
    }, {
      deleteBy: {
        _id: id,
        email: user.email
      }
    })
    return this.roleModel.softDelete({
      _id: id
    },
    );
  }
}

