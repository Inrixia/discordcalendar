export const onRequest: PagesFunction = async ({ request }) => {
	console.log(request);
	return new Response("Hello, world!");
};
