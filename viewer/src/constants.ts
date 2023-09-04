
export const DEFAULT_RESPONSE = {
  JSON: {
    code: 200,
    success: true,
    message: 'SUCCSS',
    data: {},
  },
  JAVASCRIPT: `(req, res) => {
    const { query } = req;
    if (query) {
      res.send({
        code: 200,
        success: true,
        message: 'SUCCSS',
        data: {},
      })
    } else {
      res.send({
        code: 200,
        success: true,
        message: 'SUCCSS',
        data: {},
      })
    }
  }`,
};

export const REQUEST_METHODS = [
  {
    label: 'GET',
    value: 'GET',
  },
  {
    label: 'POST',
    value: 'POST',
  },
];

export const YES_NOT = [
  {
    label: '是',
    value: true,
  },
  {
    label: '否',
    value: false,
  },
];
