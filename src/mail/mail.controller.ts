import { Controller, Get } from '@nestjs/common';
import { MailService } from './mail.service';
import { Public, ResponseMessage } from 'src/decorator/customize';
import { MailerService } from '@nestjs-modules/mailer';
import { Subscriber, SubscriberDocument } from 'src/subscribers/schema/subscriber.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { Job, JobDocument } from 'src/jobs/schema/job.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';


// để chạy được new-job.hbs cần phải config vì nestjs kh biên dịch
//khác với views vì view chỉ để hiển thị nên kh cần sử
//sửa trong file nest-cli.jon
//"compilerOptions": {
//   "assets": [
//     "mail/templates/**/*"
//   ],
//   "watchAssets": true,
//   "deleteOutDir": true
// }

@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private mailerService: MailerService,

    @InjectModel(Subscriber.name)
    private subscriberModel: SoftDeleteModel<SubscriberDocument>,

    @InjectModel(Job.name)
    private jobModel: SoftDeleteModel<JobDocument>


  ) { }


  @Get()
  @Public()
  @ResponseMessage("Test email")
  @Cron("0 10 0 * * 0")
  async handleTestEmail() {

    //subscribers là một array object được trả về
    // tìm tất cả các subscriber
    const subscribers = await this.subscriberModel.find({});
    for (const subs of subscribers) {
      // *****
      //check từng sub và gửi mail từng sub
      const subSkills = subs.skills //skills ở đây là mảng các skills của subscriber
      const jobMatchingSkills = await this.jobModel.find({ skills: { $in: subSkills } })

      if (jobMatchingSkills?.length) {
        const jobs = jobMatchingSkills.map(item => {
          return {
            name: item.name,
            company: item.company.name,
            salary: `${item.salary}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + " đ",
            skills: item.skills
          }

        })
        await this.mailerService.sendMail({
          to: "jlq6902@gmail.com",
          from: '"Support Team" <support@example.com>', // override default from
          subject: 'Welcome to Nice App! Confirm your Email',
          //phải khai báo nó dịch code cả mail và test
          //vì nó tìm trong file dịch code tưf typescript sang javascript
          template: "new-job",
          // context để chuyển qua template
          context: {
            receiver: subs.name,
            jobs: jobs
          }
        });
      }

      //*** 
    }


  }
}
