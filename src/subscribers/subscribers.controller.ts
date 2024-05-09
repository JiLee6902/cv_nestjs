
import { SubscribersService } from './subscribers.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { Public, ResponseMessage, SkipCheckPermission, User } from 'src/decorator/customize';
import { IUser } from 'src/users/users.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('subscribers')
@Controller('subscribers')
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  @Post()
  @ResponseMessage("Create a new job")
  create(
    @Body() createSubscriberDto: CreateSubscriberDto,
    @User() user: IUser
  ) {
    
    return this.subscribersService.create(createSubscriberDto, user);
  }

  
  @Get()
  @Public()
  @ResponseMessage("Fetch List Job with paginate")
  findAll(
    @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @Query() qs: string
    ) {
    return this.subscribersService.findAll(+currentPage, +limit, qs);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.subscribersService.findOne(id);
  }

  @Post('skills')
  @ResponseMessage("Get subscriber's skills")
  @SkipCheckPermission()
  getUserSkils(@User() user : IUser) {
    return this.subscribersService.getSkills(user)
  }

  @Patch()
  @SkipCheckPermission()
  @ResponseMessage("Update a job")
  update(
   
    @Body() updateSubscriberDto: UpdateSubscriberDto,
    @User() user: IUser
  ) {
    return this.subscribersService.update(updateSubscriberDto, user);
  }

  @Delete(':id')
  @ResponseMessage("Delete a job")
  remove(
    @Param('id') id: string,
    @User() user: IUser
    ) {
    return this.subscribersService.remove(id, user);
  }
}
