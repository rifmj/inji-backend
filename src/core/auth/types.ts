import {
  ClassSerializerInterceptor,
  NestInterceptor,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from './AuthGuard';
import { ApiBasicAuth, ApiOperation } from '@nestjs/swagger';

const AuthorizedGuards = UseGuards(AuthGuard);

export function UseAppGuards({
  interceptors = [],
  summary,
  isSerialized,
}: {
  action: string;
  policies?: any[];
  interceptors?: NestInterceptor[];
  summary?: string;
  isPaginated?: boolean;
  isEncrypted?: boolean;
  isSerialized?: boolean;
  versioned?: any;
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    AuthorizedGuards(target, propertyKey, descriptor);
    UseInterceptors(...interceptors)(target, propertyKey, descriptor);
    if (summary) {
      ApiOperation({
        summary,
      })(target, propertyKey, descriptor);
    }
    if (isSerialized) {
      UseInterceptors(ClassSerializerInterceptor)(
        target,
        propertyKey,
        descriptor,
      );
    }
    ApiBasicAuth('JWT')(target, propertyKey, descriptor);
  };
}
