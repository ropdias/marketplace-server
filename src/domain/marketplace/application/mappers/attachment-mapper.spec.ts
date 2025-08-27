import { AttachmentMapper } from './attachment-mapper'
import { makeAttachment } from 'test/factories/make-attachment'

let sut: AttachmentMapper

describe('AttachmentMapper', () => {
  beforeEach(() => {
    sut = new AttachmentMapper()
  })

  it('should map attachment to DTO', () => {
    const attachment = makeAttachment()

    const dto = sut.toDTO(attachment)

    expect(dto).toEqual({
      id: attachment.id.toString(),
      url: attachment.url,
    })
  })
})
