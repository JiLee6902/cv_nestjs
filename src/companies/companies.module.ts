import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from './schemas/company.schema';
import { UserSchema } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';
import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [
    UsersModule,
    FilesModule,
    MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }])],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService]
})
export class CompaniesModule { }
