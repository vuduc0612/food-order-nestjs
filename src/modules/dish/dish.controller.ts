import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Dishes')
@Controller('dish')
export class DishController {}
