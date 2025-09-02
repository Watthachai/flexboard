# 📋 Bitbucket Repository Variables Setup

## ต้องตั้งตัวแปรเหล่านี้ใน Bitbucket Repository Variables:

### 🔧 GCP Configuration (5 ตัวแปร)

```
GCP_PROJECT=your-gcp-project-id
GCP_REGION=asia-southeast1
AR_REPO=flexboard
GCP_SA_EMAIL=bitbucket-deployer@your-project.iam.gserviceaccount.com
GCP_SA_KEY_BASE64=<base64-encoded-key>
```

### 🛠️ DEV Environment (6 ตัวแปร)

```
FIREBASE_PROJECT_ID_DEV=flexboard-467509
FIREBASE_PRIVATE_KEY_DEV="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC2/Xh3jlhHzxxW\nUFAnL3wJXCMlbAoOgtym1VcEB5f4JGcHI+AW0XcJg8MvNXEWqTVuX8uzjhecLYpD\nUmqyzxgxRG5Z3rU8dXcfQg6uZy8fDLA6eSPfKhJHh5KTzPN/u9zTHD+qW4B1KK5D\n4ht1fA5IcGXgiPL62OYvWXTgTvRfMNPZcOHXPsfztmak/fYjqPwO3hBOavVv++Kq\nBTmPVaepnthLhJd2wAnGupzgSroV4lM35ATucvv80nSm+5k7lAdpqJhsYbi0hhMs\nqslv6/EvZwGkY8QN7uUZ2YU5HkgI+7hYR4RF1CHwUAcnmlLGmCVk7RJceBNx88W/\nHoclgLP/AgMBAAECggEACQoleNZ90vJOxo7KHt1wJbA5BkC7kHLzfoRce5T6c2Ys\n9sPVbpsjY8NwEXV05Dcwrgaqc/DJhswTH/dC0Rl86vYj82mWj2mIHHGxcvki8Ug5\nrnHMjVoxM/plCcsenklEA+PJ21sQ0fjT/wN88sVRmU+AIOLzCeRMHruvE+Oim88i\nyx8tQia6NXZ/JoBWM80xVzBmX36bCTcaojXAiXi5oTDvzHrCdjQWxEDDbvBJve8d\nyL8AzIj8z2CYcLVBOxqwlYmUV5ekPgezuFQ1gkPkyn6FFGurYTKLvlTRMNLSNxDg\n2j8dc2zxQO68yWoS1XdTOsdEMD6RUBmFgc84wUPmKQKBgQDfHiQ/wT0rinHe/7lS\n7sViPO3eHAvuP/R6guSl8BG+apVbE3cF03m16uQY8t7wJpGZgZ8DUrRBYBcNlxO/\nTCUje5W7pexLkdsTFULmAWHQlpt3Wp6jGawBf4wJRizJ9mJT08mlmT+x+hKRSX4w\nBKQdoGfdi5qR5H330Q6TLZ2QZwKBgQDR9WGOugFsosb98IHnPQCcCyD6vDKgP45H\nReVUx9lFzufiPeZaaHCseRKs6TZwhltN08fefy1JJxQO6S8Py56EZDJDmLdOt9gh\np9bDF8OmFOBKhSyIbqIZGweApIqJMP7Zp6RxJ4H/xEQ0L2iKYVAipPhrN64OuY6B\nozOH6mSgqQKBgEe9GUqmh1SInzRkZOIVg8GidZkEy5E/XwxFKd9w4UOoYX13NL3a\n0Td83vpmnOf6frYsx0P6Q5sBmmf0O5U2lnpiMjKzltZ1f0sTev8ZUqoOws4NhRRM\nHNIegJg6yAvn/JWXcy6bp69CCNZOGxS1aU9dVAgX6wsdvKMBxP3tnMvhAoGBAK8Z\ndcMSXR28ozgk3DF9LoT0wwxY59+9IWtPX3LVON5/L+P+u52qfE1aq7iIxl4RrxO5\nC3cDmUDo1lGZJyaFKi4/Yav+MOH1cMqgrvsFVqWrw2JirkEaAxXs9NTUZLUFp4Td\nysaTrFch17+tygGeJra93m+MgBzHo5F6Cf/P+xwBAoGBAMNXcP3v2xBNLYgvc1er\n9euEIUIbvi7o3hefd40wWQQatW24s/pWdS/MaR+3XwkMXmh5I3Oi2GlIWZAk6HyA\n868eQ1Y2Q1OvndK1b7pEqprUjzjjCjNMUCZDZmSFJHIAIEA7oOiR3bcnK+jctBID\nftckhcFGR6S5uEY4KPYHZmHh\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL_DEV=firebase-adminsdk-fbsvc@flexboard-467509.iam.gserviceaccount.com
JWT_SECRET_DEV=aaa3e357bac696f1e384f293ab0eebd37eacd951cbe86ee60dd8adbdc8e83b03
CORS_ORIGINS_DEV=https://control-plane-ui-dev-xyz.a.run.app
NEXT_PUBLIC_API_URL_DEV=https://control-plane-api-dev-xyz.a.run.app
```

### 🚀 PRODUCTION Environment (6 ตัวแปร)

```
FIREBASE_PROJECT_ID_PRODUCTION=flexboard-466304
FIREBASE_PRIVATE_KEY_PRODUCTION="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDDJVD748USGxDd\nGslx0NDpxMdyn8VV3ehDzX2BN6fENvE4zWJIBv5crcf0V2Mq29FkxBtaZpvkBtZS\nI1pGlkypkx3CsQ8T/m0wkxniR03WJSTJfULVE+pW27X56FnJPqD3dXMBy8vl9D/A\n5AfkepPYrvTNQ6qrsa6VNmT47eLzPq6sq9jXaYrbvWydv4Np8FpU1X5OSdpdHhhm\nCbnSMAv+a3dMMZh28PAyNcrELulG7fYE1DlaLztqhlNNpHV00WLcjH4A9Vpc6vHS\nmGBmp5z/dVBSE5xCC3UoGw0N50veL1LTZwvrIpl18XXeyl6uegRY2U2GOb6Fl9Fa\n54PwZlDHAgMBAAECggEAB4pbPIYtFFKqacsLQTivCL8f3ho17OgdIhkAQke/ek0f\nwp58eKS9G9gZxeydFbWo4HOwTFFOQ3uYb8GlhiYCwnpkA1uqimpPcsv7L/3Ooqcx\nM6KBhYeIsDKoeM+w0jCJsVGaa4xrDZ5xbRCU6A//DFxRKta9cy48qs/GMAvwj2my\nsHGbe4dx09PONzOszZoyeZTGVBrfxe2bGiAMd81uH/Ef7pmNUHOkl4RLtwhTRzVr\n3sUDw5tWRJ5t6yMORz0MV6i99+g1FgSwiTAMWX9aOslPcDuKki/MwhOwj69+WaZ9\nVgbJ1at6X3I2sYFj+iaQtlyO78jJZa3ko1wnPcoN+QKBgQDuiBYD9si7Abm0EzjT\nGieu2hxKbsCU7/c5aJlfNwwyKrji2KGDguUOuokCo7n+cJUvXU9gLtp9ZzXOx6r+\nimAIU/3Wim/n+q1yvKEkRQW4cuNpcmgVe7P76mD+EC0HMKLhcrXpphZHPp4c66wu\nhhULmY3o2TIWQ43tNUbapxInGQKBgQDRb9jMOGeZ8xQ7BU5B5/LGHiYb619Q6bzf\nm/qD2hvV/b2rXLBYkZoa3xEe353oTnsut1C3vwexuGhI7FM4gzWv3q+atdoRggqx\nQuR4rjzSUSGaPBdpOctLRXcv28bmry6o/4QRenGESSjU4VigxuFMnglxtgEluwI6\nCOjnEtqS3wKBgQDsvapEEupVGLhMLovGkX3zP8y2X0fKSoSvuM4IP2VeYSKRGvrq\nwL5AqQiU0xUloG2gzdabGsWFkytHaMqgyYvYmCwmg83fiuAdMXQpwEuWLojgvkjp\nkZYoIA5V+o4GRdJTOfusw0f3PAHHqGyC3FcE5UmAYhkhGblCRg9lsk4E+QKBgElT\nUGMHqHYE3eNgEysN6zij25HQ0VlBzGe5c3bwSOid4ub5F6CasYqQ6KyXe/CWcZhE\nhBUg46+8MX6+htB1V7mQTIjs/EE+90Fiex0pW5AC6bHXMhccLenXk0gFOVkQolR2\nySVZah73gj0t/Fql5sFtXz8ZisNL+xaYgfpM5oufAoGBANMlrZ2BHxhS8iw6O7Rx\naaFL+vk6IN76WaeS/NI4+Ckk+2VvEI4AsPBPO1uwvIvi5CoWgqq+9Y/kAp73WbtG\ngmLAC7UpEZsClqVFYVdKSNWfzLYhvseCKYFALkB6Es1shroLnAwsIFBoByi6chIP\nVvDbL38mE3wusUkwLDYvbtGz\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL_PRODUCTION=firebase-adminsdk-fbsvc@flexboard-466304.iam.gserviceaccount.com
JWT_SECRET_PRODUCTION=your-new-production-jwt-secret-here
CORS_ORIGINS_PRODUCTION=https://control-plane-ui-xyz.a.run.app
NEXT_PUBLIC_API_URL_PRODUCTION=https://control-plane-api-xyz.a.run.app
```

## 📊 สรุป

- **รวมทั้งหมด**: 17 ตัวแปร
- **GCP Config**: 5 ตัวแปร
- **DEV Environment**: 6 ตัวแปร
- **PRODUCTION Environment**: 6 ตัวแปร

## ⚠️ สิ่งที่ต้องระวัง

1. **Firebase Private Key**: ต้อง copy ทั้งหมดรวม `\n` (newlines)
2. **JWT_SECRET_PRODUCTION**: ต้องสร้างใหม่ แตกต่างจาก DEV
3. **URLs**: จะได้จริงหลัง deploy ครั้งแรก แล้วค่อยอัปเดต

## 🎯 หลังจากตั้งครบแล้ว

Push ไป dev branch → Bitbucket Pipelines จะ deploy อัตโนมัติ! 🚀
