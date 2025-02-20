import { PartialType } from '@nestjs/mapped-types';
import { CreateResumeDto } from './create-resume.dto';
import { IsArray, IsEmail, IsNotEmpty, ValidateNested } from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';

 class UpdateBy {
    @IsNotEmpty()
    _id: Types.ObjectId;
    
    @IsNotEmpty()
    @IsEmail()
    email: string;
}


class History {
    @IsNotEmpty()
    status: string;

    @IsNotEmpty()
    updateAt: Date;

    @ValidateNested()
    @IsNotEmpty()
    @Type(() => UpdateBy)
    updateBy: UpdateBy
} 

export class UpdateResumeDto extends PartialType(CreateResumeDto) {
    @IsNotEmpty()
    @IsArray()
    @ValidateNested()
    @Type(() => History)
    history: History[]

}
