import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyDto } from './create-company.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateCompanyDto{
    _id: string;

    @IsNotEmpty({message: 'Name không được để trống'})
    name: string;

    @IsNotEmpty()
    address: string;

    @IsNotEmpty()
    description: string;

    @IsNotEmpty()
    logo: string;

}
