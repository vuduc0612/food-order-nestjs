import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Order Details')
@Controller('order-detail')
export class OrderDetailController {}
