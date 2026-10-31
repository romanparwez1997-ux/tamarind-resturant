// Keep unknown API URLs as JSON rather than an HTML 404 page.
function notFound() {
  return Response.json({ error: 'Not found' }, { status: 404 })
}

export { notFound as GET, notFound as POST, notFound as PUT, notFound as PATCH, notFound as DELETE }
