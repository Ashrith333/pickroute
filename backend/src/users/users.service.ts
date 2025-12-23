import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByPhone(phone: string): Promise<User> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async updateLocation(userId: string, lat: number, lng: number) {
    const user = await this.findOne(userId);
    if (user) {
      user.currentLocation = `POINT(${lng} ${lat})`;
      await this.userRepository.save(user);
    }
    return user;
  }
}

