import { AttachmentMapper } from './attachment-mapper'
import { makeAttachment } from 'test/factories/make-attachment'

describe('AttachmentMapper', () => {
  it('should map attachment to DTO', () => {
    const attachment = makeAttachment()

    const dto = AttachmentMapper.toDTO(attachment)

    expect(dto).toEqual({
      id: attachment.id.toString(),
      url: attachment.url,
    })
  })
})
