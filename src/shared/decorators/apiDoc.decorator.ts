import { applyDecorators, Post, Type, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiProperty,
  ApiResponseOptions,
  getSchemaPath,
} from '@nestjs/swagger';
import { HttpResponse, PaginationMetaData } from 'shared/dto/response.dto';

export enum ApiDataWrapType {
  pagination,
  array,
}

type TApiSuccessResponse<T> = {
  dataType?: T | string;
  summary?: string;
  wrapType?: ApiDataWrapType;
  messageCodes?: string;
};

function getTypeInfo<T extends Type>(type: T | string) {
  if (typeof type === 'string') {
    return {
      type: type,
    };
  }

  return {
    $ref: getSchemaPath(type),
  };
}

function dataSuccessResponse<T extends Type>(type: T | string, wrapType?: ApiDataWrapType) {
  if (wrapType === ApiDataWrapType.pagination) {
    return {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: getTypeInfo(type),
        },
        pagination: { $ref: getSchemaPath(PaginationMetaData) },
      },
    };
  }

  if (wrapType === ApiDataWrapType.array) {
    return {
      type: 'array',
      items: getTypeInfo(type),
    };
  }

  return getTypeInfo(type);
}

export function ApiBaseOkResponse<T extends Type>(options: TApiSuccessResponse<T>): MethodDecorator {
  const { dataType, messageCodes, summary, wrapType } = options;

  const apiOkOptions: ApiResponseOptions = {
    schema: {
      allOf: [
        { $ref: getSchemaPath(HttpResponse) },
        {
          properties: {
            statusCode: {
              type: 'number',
            },
            messageCode: {
              type: 'string',
              description: messageCodes,
            },
            data: dataType ? dataSuccessResponse(dataType, wrapType) : {},
            success: {
              type: 'boolean',
            },
          },
        },
      ],
    },
  };

  const decorators: MethodDecorator[] = [];

  decorators.push(ApiExtraModels(HttpResponse));
  decorators.push(ApiExtraModels(PaginationMetaData));
  decorators.push(ApiOkResponse(apiOkOptions));
  decorators.push(ApiOperation({ summary }));

  if (!dataType || typeof dataType === 'string') {
    return applyDecorators(...decorators);
  }

  decorators.push(ApiExtraModels(dataType));

  return applyDecorators(...decorators);
}

export function ApiFileResponse(options: { description: string; type: string }): MethodDecorator {
  return applyDecorators(
    ApiOperation({ description: options.description }),
    ApiProduces(options.type),
    ApiOkResponse({ schema: { type: 'file' } }),
  );
}

export function ApiUploadFile<T extends Type>(options: {
  type?: T;
  path?: string;
  bodyDescription?: string;
}): MethodDecorator {
  const arr = [
    ApiConsumes('multipart/form-data'),
    Post(options.path),
    UseInterceptors(FileInterceptor('file')),
    ApiExtraModels(FileSchema),
  ];
  if (options.type) {
    arr.push(
      ApiBody({
        schema: {
          allOf: [{ $ref: getSchemaPath(options.type) }, { $ref: getSchemaPath(FileSchema) }],
        },
      }),
      ApiExtraModels(options.type),
    );
  } else {
    arr.push(ApiBody({ type: FileSchema }));
  }

  return applyDecorators(...arr);
}

class FileSchema {
  @ApiProperty({ type: 'file' })
  file: Express.Multer.File;
}
