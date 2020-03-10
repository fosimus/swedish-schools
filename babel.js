require('@babel/register')({
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        targets: {
          node: 'current'
        }
      }
    ]
  ]
})
