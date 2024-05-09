import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Job, JobDocument } from './schema/job.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from 'src/users/users.interface';
import aqp from 'api-query-params';
import mongoose from 'mongoose';
import dayjs from 'dayjs';


@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name)
    private jobModel: SoftDeleteModel<JobDocument>
  ) { }

  async create(createJobDto: CreateJobDto, user: IUser) {
    const {
      name, skills, company, salary, quantity,
      level, description, startDate, endDate, isActive, location
    } = createJobDto


    let newJob = await this.jobModel.create({
      name, skills, company, salary, quantity,
      level, description, startDate, endDate, isActive, location,
      createdBy: {
        _id: user._id,
        email: user.email
      }
    })

    return {
      _id: newJob?._id,
      createdAt: newJob?.createdAt
      //createAt tự cập nhật date cho mình
    }

  }

  compareDates(startDate: Date, endDate: Date) {
    const start = dayjs(startDate)
    const end = dayjs(endDate)
    let check = true;
    if (start.isAfter(end)) {
      check = false;
      return check;
    }
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    //skip = offset
    let offset = (+currentPage - 1) * (+limit);
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = (await this.jobModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit)

    //2 cách khác ép kiểu sort thành kiểu any
    // let { sort }= <{sort: any}>aqp(rq);
    //let { sort }: {sort: any}= aqp(rq);



    const result = await this.jobModel.find(filter)
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
    return this.jobModel.findOne({
      _id: id
    });
  }

  findOneByUsername(name: string) {

    return this.jobModel.findOne({
      name: name
    });
  }


  async update(id: string, updateJobDto: UpdateJobDto, user: IUser) {
    const updated = await this.jobModel.updateOne(
      {
        _id: id
      },
      {
        ...updateJobDto,
        updatedBy: {
          _id: user._id,
          email: user.email
        }
      });

    return updated;
  }

  async remove(id: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id))
      return 'not found job';

    await this.jobModel.updateOne({
      _id: id
    }, {
      deleteBy: {
        _id: id,
        email: user.email
      }
    })
    return this.jobModel.softDelete({
      _id: id
    },
    );
  }
}
