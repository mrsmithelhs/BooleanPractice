function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');
  template.assignmentBootstrap = buildAssignmentBootstrap_(e);
  return template.evaluate().setTitle('Boolean Practice');
}
