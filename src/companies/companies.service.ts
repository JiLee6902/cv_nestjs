import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Company, CompanyDocument } from './schemas/company.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import mongoose from 'mongoose';
import { IUser } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { isEmpty } from 'class-validator';
import { FilesService } from 'src/files/files.service';
import { FilesController } from 'src/files/files.controller';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name)
    private companyModel: SoftDeleteModel<CompanyDocument>,
 
  ) { }


  async create(createCompanyDto: CreateCompanyDto, user: IUser) {
  //  const imageName = await this.fileController.uploadFile;
    return this.companyModel.create({
      ...createCompanyDto,
    //  logo: imageName,
      createdBy: {
        _id: user._id,
        email: user.email
      }
    })

  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    //skip = offset
    let offset = (+currentPage - 1) * (+limit);
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = (await this.companyModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit)

    //2 cách khác ép kiểu sort thành kiểu any
    // let { sort }= <{sort: any}>aqp(rq);
    //let { sort }: {sort: any}= aqp(rq);



    const result = await this.companyModel.find(filter)
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

  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('not found company');
    }
      
    return await this.companyModel.findById(id);
  }

  findOneByUsername(name: string) {

    return this.companyModel.findOne({
      name: name
    });
  }


  async update(id: string, updateCompanyDto: UpdateCompanyDto, user: IUser) {
    return await this.companyModel.updateOne(
      {
        _id: id
      },
      {
        ...updateCompanyDto,
        updatedBy: {
          _id: user._id,
          email: user.email
        }
      });
  }

  async remove(id: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id))
      return 'not found user';

    await this.companyModel.updateOne({
      _id: id
    }, {
      deleteBy: {
        _id: id,
        email: user.email
      }
    })
    return this.companyModel.softDelete({
      _id: id
    },
    );
  }
}
