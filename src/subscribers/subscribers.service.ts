import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';

import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { IUser } from 'src/users/users.interface';
import aqp from 'api-query-params';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import { Subscriber, SubscriberDocument } from './schema/subscriber.schema';


@Injectable()
export class SubscribersService {
  constructor(
    @InjectModel(Subscriber.name)
    private subscriberModel: SoftDeleteModel<SubscriberDocument>
  ) { }

  async create(createSubscriberDto: CreateSubscriberDto, user: IUser) {
    const {
      email,name,skills
    } = createSubscriberDto

    const isExist = await this.subscriberModel.findOne({email})
    if(isExist) {
      throw new BadRequestException('This email is exist!')
    }

    let newJob = await this.subscriberModel.create({
      email,name,skills,
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

    const totalItems = (await this.subscriberModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit)

    //2 cách khác ép kiểu sort thành kiểu any
    // let { sort }= <{sort: any}>aqp(rq);
    //let { sort }: {sort: any}= aqp(rq);



    const result = await this.subscriberModel.find(filter)
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
    return this.subscriberModel.findOne({
      _id: id
    });
  }

  findOneByUsername(name: string) {

    return this.subscriberModel.findOne({
      name: name
    });
  }


  async update( updateSubscriberDto: UpdateSubscriberDto, user: IUser) {
    const updated = await this.subscriberModel.updateOne(
      {
        email: user.email
      },
      {
        ...updateSubscriberDto,
        updatedBy: {
          _id: user._id,
          email: user.email
        }
      },
      {
        upsert: true
      }
      );

    return updated;
  }

  async remove(id: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id))
      return 'not found job';

    await this.subscriberModel.updateOne({
      _id: id
    }, {
      deleteBy: {
        _id: id,
        email: user.email
      }
    })
    return this.subscriberModel.softDelete({
      _id: id
    },
    );
  }


  //findOne({email}, {skills: 1}) sẽ trả về một tài liệu subscriber 
  //có trường email trùng khớp với đối số email, 
  //nhưng chỉ bao gồm trường skills, 
  //các trường khác như name sẽ không được bao gồm trong kết quả trả về.
  async getSkills(user: IUser) {
    const {email} = user
    return await this.subscriberModel.findOne({email}, {skills: 1})
  }
}
