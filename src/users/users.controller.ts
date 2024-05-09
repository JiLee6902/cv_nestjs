import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from './users.interface';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @ResponseMessage("Create a new User")
  async create(
    @Body() createUserDto: CreateUserDto,
    @User() user : IUser
    ) {
    let newUser = await this.usersService.create(createUserDto, user);
    return {
      _id: newUser?._id,
      createdAt: newUser.createdAt
    }
  }

  @Get()
  @ResponseMessage("Fetch user with paginate")
  findAll(
   @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @Query() qs: string
    ) {
    return this.usersService.findAll(+currentPage, +limit, qs);
   
  }

  @Public()
  @ResponseMessage("Fetch user by id")
  @Get(':id')
  findOne(@Param('id') id: string) {
    const foundUser =  this.usersService.findOne(id);
    return foundUser;
  }

  @Patch()
  @ResponseMessage("Update a new user")
  update(
    @User() user : IUser,
    @Body() updateUserDto: UpdateUserDto
    ) {
    return this.usersService.update(updateUserDto,user);
  }

  @Delete(':id')
  @ResponseMessage("Delete a new user")
  remove(
    @User() user : IUser,
    @Param('id') id: string
    ) {
    return this.usersService.remove(id,user);
  }
}
