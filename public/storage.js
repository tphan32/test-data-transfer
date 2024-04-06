import {
  createAzureBlobServiceClient,
  getAzureContainer,
} from "@tphan32/data-transfer";

const blobServiceClient = createAzureBlobServiceClient(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);
const container = getAzureContainer(
  blobServiceClient,
  process.env.AZURE_STORAGE_CONTAINER_NAME
);

const azureUploadInfo = {
  container,
  blockBlobClient: null,
  blockIds: null,
  count: 0,
  uniqueBlobName: null,
};

export { azureUploadInfo };
