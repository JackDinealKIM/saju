import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

const ADMIN_PASSWORD = 'admin1234'; // 실제로는 환경변수로 관리

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const password = data.get('password') as string;

		if (password === ADMIN_PASSWORD) {
			cookies.set('admin_auth', 'true', {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				maxAge: 60 * 60 * 24 * 7 // 7일
			});

			throw redirect(302, '/admin');
		}

		return fail(401, {
			error: '비밀번호가 올바르지 않습니다.'
		});
	}
};
