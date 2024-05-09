
import { Transform, Type } from "class-transformer";
import { IsNotEmpty, IsEmail, IsNotEmptyObject, IsObject, ValidateNested, IsArray, IsString, IsDate, IsBoolean } from "class-validator";
import mongoose from "mongoose";


class Company {
    _id: mongoose.Schema.Types.ObjectId;

    @IsNotEmpty()
    name: string

    @IsNotEmpty()
    logo:string;
}

export class CreateJobDto {

    @IsNotEmpty()
    name: string;


    @IsNotEmpty({message: 'skills not empty!'})
    @IsArray({message: 'Not type is array!'})
    @IsString({each: true, message: 'Skill is string format!'})
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
    // để convert dữ liệu được gửi lên bởi @Body từ string qua date
    @Transform(({value}) => new Date(value))
    @IsDate({message: 'StartDate is date format!'})
    startDate: Date;

    @IsNotEmpty()
    @Transform(({value}) => new Date(value))
    @IsDate({message: 'EndDate is date format!'})
    endDate: Date;

    @IsNotEmpty()
    @IsBoolean({message: 'isActive is boolean format'})
    isActive: Date;

 
}