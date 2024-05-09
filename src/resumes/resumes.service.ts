import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserCvDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { Resume, ResumeDocument } from './schema/resume.schema';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from 'src/users/users.interface';
import aqp from 'api-query-params';
import mongoose from 'mongoose';

@Injectable()
export class ResumesService {
  constructor(
    @InjectModel(Resume.name)
    private resumeModel: SoftDeleteModel<ResumeDocument>,

  ) { }


  async create(createUserCvDto: CreateUserCvDto, user: IUser) {
    //  const imageName = await this.fileController.uploadFile;
    const { url, companyId, jobId } = createUserCvDto;
    const { email, _id } = user;

    const newCV = await this.resumeModel.create({
      url, companyId, jobId, email,
      userId: _id,
      status: "PENDING",
      createdBy: { _id: user._id },
      history: [
        {
          //có thể 3 lượt pending -> review -> accept/reject
          status: "PENDING",
          updatedAt: new Date,
          updateBy: {
            _id: user._id,
            email: user.email
          }
        }
      ]
    })

    return {
      _id: newCV?._id,
      createdAt: newCV.createdAt
    }

  }

  async findAll(currentPage: number, limit: number, qs: string) {

    //populate=companyId(companyId - là tên biến nó hứng trọn ref và đương nhiên trả tất cả data)
    //populate cũng có thể hiểu là lấy data khi join các bảng lại
    //phải có populate mới lấy được model company và job nhúng vào
    const { filter, sort, population, projection } = aqp(qs);
    //trường fields(cùng ý nghĩa với projection) :lọc ra số lượng thuộc tính muốn lấy)
    // ví dụ: fields=companyId.id, companyId.name
    //select(projection) <=> companyId.id, companyId.name
    delete filter.current;
    delete filter.pageSize;

    //skip = offset
    let offset = (+currentPage - 1) * (+limit);
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = (await this.resumeModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit)

    //2 cách khác ép kiểu sort thành kiểu any
    // let { sort }= <{sort: any}>aqp(rq);
    //let { sort }: {sort: any}= aqp(rq);



    const result = await this.resumeModel.find(filter)
      .skip(offset)
      .limit(defaultLimit)
      // @ts-ignore: Unreachable code error
      .sort(sort)
      .populate(population) //thường sẽ là populate(1 model bất kỳ) //populate=id thì dùng polation để lấy model đó
      .select(projection as any) //fields truyền vào cho projection xử lý, xong dùng select để show ra và
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
      throw new BadRequestException('not found Resume');
    }

    return await this.resumeModel.findById(id);
  }

  async findByUsers(user: IUser) {
    return await this.resumeModel.find({
      userId: user._id
    }).sort("-createdAt")
      .populate([
        {
          path: "companyId",
          select: { name: 1 }
        },
        {
          path: "jobId",
          select: {name :1}
        }
      ])
  }


  async update(id: string, status: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('not found Resume');
    }
    const updated = await this.resumeModel.updateOne(
      {
        _id: id
      },
      {
        //bị override
        status,
        updatedBy: {
          _id: user._id,
          email: user.email
        },
        $push: {
          history: {
            status: status,
            updatedAt: new Date,
            updateBy: {
              _id: user._id,
              email: user.email
            }
          }
        }

      });

    return updated;
  }

  async remove(id: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id))
      return 'not found user';

    await this.resumeModel.updateOne({
      _id: id
    }, {
      deleteBy: {
        _id: id,
        email: user.email
      }
    })
    return this.resumeModel.softDelete({
      _id: id
    },
    );
  }
}
