import status from 'http-status-codes';
import { User } from '../../models/User';
import { apiResponse } from '../../utils/apiResponse.utils';
import { CustomError } from '../../errors/custom-error';
import { generateAccessToken } from '../../utils/jwt.utils';

const refreshToken = async (id: string) => {
  try {
    const user = await User.findById(id);
    if (!user)
      throw apiResponse(status.NOT_FOUND, 'NOT_FOUND', 'User not found');

    const accessToken = generateAccessToken(user);

    return apiResponse(status.OK, 'OK', 'Success generate access token', {
      accessToken,
    });
  } catch (err) {
    if (err instanceof CustomError) {
      throw err;
    }
  }
};

export { refreshToken };
