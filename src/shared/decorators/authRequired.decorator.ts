import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthenticateApplicant, AuthenticatePublicApiKey, AuthenticateUser } from 'shared/guards/authenticate.guard';

export function AuthRequired(): ClassDecorator & PropertyDecorator {
  return applyDecorators(UseGuards(AuthenticateUser), ApiBearerAuth());
}

export function ApplicantAuthRequired(): ClassDecorator & PropertyDecorator {
  return applyDecorators(UseGuards(AuthenticateApplicant), ApiBearerAuth());
}

export function ApiKeyRequired(): ClassDecorator & PropertyDecorator {
  return applyDecorators(UseGuards(AuthenticatePublicApiKey));
}
