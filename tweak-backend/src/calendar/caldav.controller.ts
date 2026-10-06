import { All, Controller, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  collectionResponse,
  hrefFile,
  itemResponse,
  multistatus,
  notFoundResponse,
  requestedHrefs,
} from './caldav';
import { CaldavService } from './caldav.service';

@Controller('caldav/:token')
export class CaldavController {
  constructor(private readonly caldavService: CaldavService) {}

  @All()
  async collection(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = await this.caldavService.findUser(token);
    const path = `/api/caldav/${token}/`;
    const items = await this.caldavService.listItems(user);
    const body = typeof req.body === 'string' ? req.body : '';

    switch (req.method) {
      case 'PROPFIND': {
        const responses = [
          collectionResponse(path, this.caldavService.ctag(items)),
        ];
        if (req.headers.depth !== '0') {
          responses.push(
            ...items.map((item) => itemResponse(path, item, false)),
          );
        }
        return this.sendMultistatus(res, responses);
      }
      case 'REPORT': {
        const withData = body.includes('calendar-data');
        if (body.includes('calendar-multiget')) {
          const responses = requestedHrefs(body).map((href) => {
            const item = items.find(
              (candidate) => candidate.href === hrefFile(href),
            );
            return item
              ? itemResponse(path, item, withData)
              : notFoundResponse(href);
          });
          return this.sendMultistatus(res, responses);
        }
        if (body.includes('calendar-query')) {
          return this.sendMultistatus(
            res,
            items.map((item) => itemResponse(path, item, withData)),
          );
        }
        return res.status(501).end();
      }
      default:
        return res.status(405).set('Allow', 'OPTIONS, PROPFIND, REPORT').end();
    }
  }

  @All(':file')
  async item(
    @Param('token') token: string,
    @Param('file') file: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = await this.caldavService.findUser(token);
    const ifMatch = req.headers['if-match'];
    const ifNoneMatch = req.headers['if-none-match'];

    switch (req.method) {
      case 'GET':
      case 'HEAD': {
        const item = await this.caldavService.getItem(user, file);
        if (!item) {
          return res.status(404).end();
        }
        res.status(200).set({
          'Content-Type': 'text/calendar; charset=utf-8',
          ETag: item.etag,
        });
        return req.method === 'HEAD' ? res.end() : res.send(item.body);
      }
      case 'PROPFIND': {
        const item = await this.caldavService.getItem(user, file);
        if (!item) {
          return res.status(404).end();
        }
        return this.sendMultistatus(res, [
          itemResponse(`/api/caldav/${token}/`, item, false),
        ]);
      }
      case 'PUT': {
        const { created } = await this.caldavService.putItem(
          user,
          file,
          typeof req.body === 'string' ? req.body : '',
          ifMatch,
          ifNoneMatch,
        );
        return res.status(created ? 201 : 204).end();
      }
      case 'DELETE': {
        const deleted = await this.caldavService.deleteItem(
          user,
          file,
          ifMatch,
        );
        return res.status(deleted ? 204 : 404).end();
      }
      default:
        return res
          .status(405)
          .set('Allow', 'OPTIONS, GET, HEAD, PROPFIND, PUT, DELETE')
          .end();
    }
  }

  private sendMultistatus(res: Response, responses: string[]) {
    return res
      .status(207)
      .set('Content-Type', 'application/xml; charset=utf-8')
      .send(multistatus(responses));
  }
}
