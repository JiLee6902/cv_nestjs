import { PartialType } from '@nestjs/mapped-types';
import { CreateJobDto } from './create-job.dto';
import { Type } from "class-transformer";
import { IsNotEmpty, IsEmail, IsNotEmptyObject, IsObject, ValidateNested } from "class-validator";
import mongoose from "mongoose";


class Company {
    _id: mongoose.Schema.Types.ObjectId;

    @IsNotEmpty()
    name: string
}

export class UpdateJobDto {

    _id: string;

    @IsNotEmpty()
    name: string;

    @IsNotEmpty({message: 'skills not empty!'})
    skills: string[];

    @IsNotEmptyObject()
    @IsObject()
    @ValidateNested()
    @Type(() => Company)
    company: Company;

   
    @IsNotEmpty()
    salary: number;

    @IsNotEmpty()
    quantity: number;

    @IsNotEmpty()
    level: string;

    @IsNotEmpty()
    description: string;
    
    @IsNotEmpty()
    location: string;

    @IsNotEmpty()
    startDate: Date;

    @IsNotEmpty()
    endDate: Date;

    @IsNotEmpty()
    isActive: Date;

}
